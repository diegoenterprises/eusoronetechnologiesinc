/**
 * LOAD CREATION WIZARD
 * 7-step wizard for shippers to create loads
 * Steps: Hazmat Classification → Quantity → Origin/Dest → Equipment → Carrier Req → Pricing → Review
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  AlertTriangle, Package, MapPin, Truck, Shield, DollarSign, 
  CheckCircle, ChevronLeft, ChevronRight, Search, Info,
  Calendar, Clock, Weight, Thermometer, FileText, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LoadData {
  // Step 1: Hazmat
  productName: string;
  isHazmat: boolean;
  hazmatClass: string;
  unNumber: string;
  packingGroup: string;
  // Step 2: Quantity
  weight: number;
  weightUnit: "lbs" | "kg";
  quantity: number;
  quantityUnit: "gallons" | "barrels" | "pallets" | "units";
  // Step 3: Origin/Destination
  origin: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    contactName: string;
    contactPhone: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    contactName: string;
    contactPhone: string;
  };
  pickupDate: string;
  pickupTime: string;
  deliveryDate: string;
  deliveryTime: string;
  // Step 4: Equipment
  equipmentType: string;
  trailerLength: string;
  temperatureControlled: boolean;
  tempMin?: number;
  tempMax?: number;
  // Step 5: Carrier Requirements
  minSafetyRating: string;
  minInsurance: number;
  hazmatEndorsement: boolean;
  twicRequired: boolean;
  tankEndorsement: boolean;
  // Step 6: Pricing
  rateType: "flat" | "per_mile" | "auction";
  flatRate?: number;
  perMileRate?: number;
  auctionMinBid?: number;
  auctionDeadline?: string;
  // Meta
  specialInstructions: string;
}

const INITIAL_LOAD: LoadData = {
  productName: "",
  isHazmat: false,
  hazmatClass: "",
  unNumber: "",
  packingGroup: "",
  weight: 0,
  weightUnit: "lbs",
  quantity: 0,
  quantityUnit: "gallons",
  origin: { name: "", address: "", city: "", state: "", zip: "", contactName: "", contactPhone: "" },
  destination: { name: "", address: "", city: "", state: "", zip: "", contactName: "", contactPhone: "" },
  pickupDate: "",
  pickupTime: "",
  deliveryDate: "",
  deliveryTime: "",
  equipmentType: "",
  trailerLength: "",
  temperatureControlled: false,
  tempMin: undefined,
  tempMax: undefined,
  minSafetyRating: "Satisfactory",
  minInsurance: 1000000,
  hazmatEndorsement: false,
  twicRequired: false,
  tankEndorsement: false,
  rateType: "flat",
  flatRate: undefined,
  perMileRate: undefined,
  auctionMinBid: undefined,
  auctionDeadline: undefined,
  specialInstructions: "",
};

const HAZMAT_CLASSES = [
  { value: "1", label: "Class 1 - Explosives" },
  { value: "2.1", label: "Class 2.1 - Flammable Gas" },
  { value: "2.2", label: "Class 2.2 - Non-Flammable Gas" },
  { value: "2.3", label: "Class 2.3 - Poison Gas" },
  { value: "3", label: "Class 3 - Flammable Liquid" },
  { value: "4.1", label: "Class 4.1 - Flammable Solid" },
  { value: "4.2", label: "Class 4.2 - Spontaneously Combustible" },
  { value: "4.3", label: "Class 4.3 - Dangerous When Wet" },
  { value: "5.1", label: "Class 5.1 - Oxidizer" },
  { value: "5.2", label: "Class 5.2 - Organic Peroxide" },
  { value: "6.1", label: "Class 6.1 - Poison" },
  { value: "6.2", label: "Class 6.2 - Infectious Substance" },
  { value: "7", label: "Class 7 - Radioactive" },
  { value: "8", label: "Class 8 - Corrosive" },
  { value: "9", label: "Class 9 - Miscellaneous" },
];

const EQUIPMENT_TYPES = [
  { value: "tank_trailer", label: "Tank Trailer", icon: Truck },
  { value: "dry_van", label: "Dry Van", icon: Package },
  { value: "flatbed", label: "Flatbed", icon: Truck },
  { value: "reefer", label: "Refrigerated", icon: Thermometer },
  { value: "lowboy", label: "Lowboy", icon: Truck },
  { value: "step_deck", label: "Step Deck", icon: Truck },
];

const STEPS = [
  { id: 1, title: "Hazmat Classification", icon: AlertTriangle },
  { id: 2, title: "Quantity & Weight", icon: Weight },
  { id: 3, title: "Origin & Destination", icon: MapPin },
  { id: 4, title: "Equipment Type", icon: Truck },
  { id: 5, title: "Carrier Requirements", icon: Shield },
  { id: 6, title: "Pricing", icon: DollarSign },
  { id: 7, title: "Review & Submit", icon: CheckCircle },
];

export default function LoadCreationWizard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadData, setLoadData] = useState<LoadData>(INITIAL_LOAD);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateLoad = (updates: Partial<LoadData>) => {
    setLoadData(prev => ({ ...prev, ...updates }));
  };

  const updateOrigin = (updates: Partial<LoadData["origin"]>) => {
    setLoadData(prev => ({ ...prev, origin: { ...prev.origin, ...updates } }));
  };

  const updateDestination = (updates: Partial<LoadData["destination"]>) => {
    setLoadData(prev => ({ ...prev, destination: { ...prev.destination, ...updates } }));
  };

  const nextStep = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Load created successfully!");
    navigate("/shipper-loads");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Hazmat loadData={loadData} updateLoad={updateLoad} />;
      case 2:
        return <Step2Quantity loadData={loadData} updateLoad={updateLoad} />;
      case 3:
        return <Step3Location loadData={loadData} updateOrigin={updateOrigin} updateDestination={updateDestination} updateLoad={updateLoad} />;
      case 4:
        return <Step4Equipment loadData={loadData} updateLoad={updateLoad} />;
      case 5:
        return <Step5CarrierReq loadData={loadData} updateLoad={updateLoad} />;
      case 6:
        return <Step6Pricing loadData={loadData} updateLoad={updateLoad} />;
      case 7:
        return <Step7Review loadData={loadData} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Load</h1>
          <p className="text-slate-400 text-sm">Step {currentStep} of 7: {STEPS[currentStep - 1].title}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/shipper-loads")} className="text-slate-400">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <Progress value={(currentStep / 7) * 100} className="h-2 mb-4" />
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isComplete = step.id < currentStep;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-1 cursor-pointer transition-colors",
                  isActive ? "text-blue-400" : isComplete ? "text-green-400" : "text-slate-600"
                )}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2",
                  isActive ? "border-blue-400 bg-blue-400/20" : 
                  isComplete ? "border-green-400 bg-green-400/20" : "border-slate-600"
                )}>
                  {isComplete ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-xs hidden md:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="border-slate-600"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 7 ? (
          <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Creating..." : "Create Load"}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Step 1: Hazmat Classification
function Step1Hazmat({ loadData, updateLoad }: { loadData: LoadData; updateLoad: (u: Partial<LoadData>) => void }) {
  const suggestClassification = () => {
    const name = loadData.productName.toLowerCase();
    if (name.includes("gasoline") || name.includes("diesel") || name.includes("fuel")) {
      updateLoad({ isHazmat: true, hazmatClass: "3", unNumber: "UN1203" });
      toast.success("ESANG AI suggests Class 3 - Flammable Liquid");
    } else if (name.includes("propane") || name.includes("lpg")) {
      updateLoad({ isHazmat: true, hazmatClass: "2.1", unNumber: "UN1978" });
      toast.success("ESANG AI suggests Class 2.1 - Flammable Gas");
    } else if (name.includes("acid")) {
      updateLoad({ isHazmat: true, hazmatClass: "8", unNumber: "UN1830" });
      toast.success("ESANG AI suggests Class 8 - Corrosive");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <Info className="w-5 h-5 text-blue-400" />
        <span className="text-sm text-blue-200">
          ESANG AI can suggest hazmat classification based on product name
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-slate-300">Product Name / Description</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={loadData.productName}
              onChange={(e) => updateLoad({ productName: e.target.value })}
              placeholder="e.g., Gasoline Unleaded 87"
              className="bg-slate-700/50 border-slate-600"
            />
            <Button variant="outline" onClick={suggestClassification} className="border-slate-600">
              <Search className="w-4 h-4 mr-2" />
              AI Suggest
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Label className="text-slate-300">Is this a Hazardous Material?</Label>
          <div className="flex gap-2">
            <Button
              variant={loadData.isHazmat ? "default" : "outline"}
              onClick={() => updateLoad({ isHazmat: true })}
              className={loadData.isHazmat ? "bg-red-600" : "border-slate-600"}
            >
              Yes
            </Button>
            <Button
              variant={!loadData.isHazmat ? "default" : "outline"}
              onClick={() => updateLoad({ isHazmat: false, hazmatClass: "", unNumber: "", packingGroup: "" })}
              className={!loadData.isHazmat ? "bg-green-600" : "border-slate-600"}
            >
              No
            </Button>
          </div>
        </div>

        {loadData.isHazmat && (
          <div className="space-y-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Hazmat Information Required</span>
            </div>

            <div>
              <Label className="text-slate-300">Hazmat Class</Label>
              <select
                value={loadData.hazmatClass}
                onChange={(e) => updateLoad({ hazmatClass: e.target.value })}
                className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
              >
                <option value="">Select Class</option>
                {HAZMAT_CLASSES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">UN Number</Label>
                <Input
                  value={loadData.unNumber}
                  onChange={(e) => updateLoad({ unNumber: e.target.value })}
                  placeholder="UN1203"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Packing Group</Label>
                <select
                  value={loadData.packingGroup}
                  onChange={(e) => updateLoad({ packingGroup: e.target.value })}
                  className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
                >
                  <option value="">Select</option>
                  <option value="I">I - Great Danger</option>
                  <option value="II">II - Medium Danger</option>
                  <option value="III">III - Minor Danger</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 2: Quantity & Weight
function Step2Quantity({ loadData, updateLoad }: { loadData: LoadData; updateLoad: (u: Partial<LoadData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300">Weight</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              value={loadData.weight || ""}
              onChange={(e) => updateLoad({ weight: Number(e.target.value) })}
              placeholder="42000"
              className="bg-slate-700/50 border-slate-600"
            />
            <select
              value={loadData.weightUnit}
              onChange={(e) => updateLoad({ weightUnit: e.target.value as "lbs" | "kg" })}
              className="w-24 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
            >
              <option value="lbs">lbs</option>
              <option value="kg">kg</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-slate-300">Quantity</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              value={loadData.quantity || ""}
              onChange={(e) => updateLoad({ quantity: Number(e.target.value) })}
              placeholder="8500"
              className="bg-slate-700/50 border-slate-600"
            />
            <select
              value={loadData.quantityUnit}
              onChange={(e) => updateLoad({ quantityUnit: e.target.value as LoadData["quantityUnit"] })}
              className="w-28 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
            >
              <option value="gallons">Gallons</option>
              <option value="barrels">Barrels</option>
              <option value="pallets">Pallets</option>
              <option value="units">Units</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-slate-700/30">
        <h4 className="text-white font-medium mb-2">Quick Reference</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
          <div>
            <p>Standard Tank Trailer: 7,000-9,500 gal</p>
            <p>MC-306/DOT-406: 9,000-9,500 gal</p>
          </div>
          <div>
            <p>Max Legal Weight: 80,000 lbs</p>
            <p>Typical Fuel Load: 8,000-8,500 gal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Origin & Destination
function Step3Location({ 
  loadData, updateOrigin, updateDestination, updateLoad 
}: { 
  loadData: LoadData; 
  updateOrigin: (u: Partial<LoadData["origin"]>) => void;
  updateDestination: (u: Partial<LoadData["destination"]>) => void;
  updateLoad: (u: Partial<LoadData>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Origin */}
      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <h4 className="text-green-400 font-medium">Pickup Location</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-slate-300">Facility Name</Label>
            <Input
              value={loadData.origin.name}
              onChange={(e) => updateOrigin({ name: e.target.value })}
              placeholder="Marathon Petroleum Terminal"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-slate-300">Address</Label>
            <Input
              value={loadData.origin.address}
              onChange={(e) => updateOrigin({ address: e.target.value })}
              placeholder="1200 Industrial Blvd"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">City</Label>
            <Input
              value={loadData.origin.city}
              onChange={(e) => updateOrigin({ city: e.target.value })}
              placeholder="Texas City"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300">State</Label>
              <Input
                value={loadData.origin.state}
                onChange={(e) => updateOrigin({ state: e.target.value })}
                placeholder="TX"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <Label className="text-slate-300">ZIP</Label>
              <Input
                value={loadData.origin.zip}
                onChange={(e) => updateOrigin({ zip: e.target.value })}
                placeholder="77590"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Contact Name</Label>
            <Input
              value={loadData.origin.contactName}
              onChange={(e) => updateOrigin({ contactName: e.target.value })}
              placeholder="John Smith"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Contact Phone</Label>
            <Input
              value={loadData.origin.contactPhone}
              onChange={(e) => updateOrigin({ contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-slate-300">Pickup Date</Label>
            <Input
              type="date"
              value={loadData.pickupDate}
              onChange={(e) => updateLoad({ pickupDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Pickup Time</Label>
            <Input
              type="time"
              value={loadData.pickupTime}
              onChange={(e) => updateLoad({ pickupTime: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Destination */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <h4 className="text-blue-400 font-medium">Delivery Location</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-slate-300">Facility Name</Label>
            <Input
              value={loadData.destination.name}
              onChange={(e) => updateDestination({ name: e.target.value })}
              placeholder="QuikTrip #4521"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-slate-300">Address</Label>
            <Input
              value={loadData.destination.address}
              onChange={(e) => updateDestination({ address: e.target.value })}
              placeholder="8900 Highway 290"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">City</Label>
            <Input
              value={loadData.destination.city}
              onChange={(e) => updateDestination({ city: e.target.value })}
              placeholder="Austin"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300">State</Label>
              <Input
                value={loadData.destination.state}
                onChange={(e) => updateDestination({ state: e.target.value })}
                placeholder="TX"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <Label className="text-slate-300">ZIP</Label>
              <Input
                value={loadData.destination.zip}
                onChange={(e) => updateDestination({ zip: e.target.value })}
                placeholder="78736"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300">Contact Name</Label>
            <Input
              value={loadData.destination.contactName}
              onChange={(e) => updateDestination({ contactName: e.target.value })}
              placeholder="Jane Doe"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Contact Phone</Label>
            <Input
              value={loadData.destination.contactPhone}
              onChange={(e) => updateDestination({ contactPhone: e.target.value })}
              placeholder="(555) 987-6543"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-slate-300">Delivery Date</Label>
            <Input
              type="date"
              value={loadData.deliveryDate}
              onChange={(e) => updateLoad({ deliveryDate: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Delivery Time</Label>
            <Input
              type="time"
              value={loadData.deliveryTime}
              onChange={(e) => updateLoad({ deliveryTime: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Equipment Type
function Step4Equipment({ loadData, updateLoad }: { loadData: LoadData; updateLoad: (u: Partial<LoadData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-slate-300 mb-3 block">Equipment Type</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EQUIPMENT_TYPES.map((eq) => {
            const Icon = eq.icon;
            const isSelected = loadData.equipmentType === eq.value;
            return (
              <button
                key={eq.value}
                onClick={() => updateLoad({ equipmentType: eq.value })}
                className={cn(
                  "p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2",
                  isSelected 
                    ? "border-blue-500 bg-blue-500/20 text-blue-400" 
                    : "border-slate-600 hover:border-slate-500 text-slate-400"
                )}
              >
                <Icon className="w-8 h-8" />
                <span className="text-sm font-medium">{eq.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-slate-300">Trailer Length</Label>
        <select
          value={loadData.trailerLength}
          onChange={(e) => updateLoad({ trailerLength: e.target.value })}
          className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
        >
          <option value="">Select Length</option>
          <option value="28">28 ft</option>
          <option value="40">40 ft</option>
          <option value="48">48 ft</option>
          <option value="53">53 ft</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <Label className="text-slate-300">Temperature Controlled?</Label>
        <div className="flex gap-2">
          <Button
            variant={loadData.temperatureControlled ? "default" : "outline"}
            onClick={() => updateLoad({ temperatureControlled: true })}
            className={loadData.temperatureControlled ? "bg-blue-600" : "border-slate-600"}
          >
            Yes
          </Button>
          <Button
            variant={!loadData.temperatureControlled ? "default" : "outline"}
            onClick={() => updateLoad({ temperatureControlled: false, tempMin: undefined, tempMax: undefined })}
            className={!loadData.temperatureControlled ? "bg-slate-600" : "border-slate-600"}
          >
            No
          </Button>
        </div>
      </div>

      {loadData.temperatureControlled && (
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div>
            <Label className="text-slate-300">Min Temp (F)</Label>
            <Input
              type="number"
              value={loadData.tempMin || ""}
              onChange={(e) => updateLoad({ tempMin: Number(e.target.value) })}
              placeholder="35"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Max Temp (F)</Label>
            <Input
              type="number"
              value={loadData.tempMax || ""}
              onChange={(e) => updateLoad({ tempMax: Number(e.target.value) })}
              placeholder="45"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Step 5: Carrier Requirements
function Step5CarrierReq({ loadData, updateLoad }: { loadData: LoadData; updateLoad: (u: Partial<LoadData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-slate-300">Minimum Safety Rating</Label>
        <select
          value={loadData.minSafetyRating}
          onChange={(e) => updateLoad({ minSafetyRating: e.target.value })}
          className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
        >
          <option value="Satisfactory">Satisfactory</option>
          <option value="Conditional">Conditional (and above)</option>
          <option value="None">No Rating Required</option>
        </select>
      </div>

      <div>
        <Label className="text-slate-300">Minimum Insurance Coverage</Label>
        <select
          value={loadData.minInsurance}
          onChange={(e) => updateLoad({ minInsurance: Number(e.target.value) })}
          className="w-full mt-1 p-2 rounded-md bg-slate-700/50 border border-slate-600 text-white"
        >
          <option value={750000}>$750,000</option>
          <option value={1000000}>$1,000,000</option>
          <option value={2000000}>$2,000,000</option>
          <option value={5000000}>$5,000,000</option>
        </select>
      </div>

      <div className="space-y-3">
        <Label className="text-slate-300 block">Required Endorsements</Label>
        
        <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 cursor-pointer">
          <input
            type="checkbox"
            checked={loadData.hazmatEndorsement}
            onChange={(e) => updateLoad({ hazmatEndorsement: e.target.checked })}
            className="w-5 h-5 rounded border-slate-600"
          />
          <div>
            <p className="text-white font-medium">Hazmat Endorsement (H)</p>
            <p className="text-sm text-slate-400">Required for hazardous materials</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 cursor-pointer">
          <input
            type="checkbox"
            checked={loadData.tankEndorsement}
            onChange={(e) => updateLoad({ tankEndorsement: e.target.checked })}
            className="w-5 h-5 rounded border-slate-600"
          />
          <div>
            <p className="text-white font-medium">Tank Endorsement (N)</p>
            <p className="text-sm text-slate-400">Required for tank vehicles</p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 cursor-pointer">
          <input
            type="checkbox"
            checked={loadData.twicRequired}
            onChange={(e) => updateLoad({ twicRequired: e.target.checked })}
            className="w-5 h-5 rounded border-slate-600"
          />
          <div>
            <p className="text-white font-medium">TWIC Card Required</p>
            <p className="text-sm text-slate-400">Transportation Worker Identification Credential</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// Step 6: Pricing
function Step6Pricing({ loadData, updateLoad }: { loadData: LoadData; updateLoad: (u: Partial<LoadData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-slate-300 mb-3 block">Rate Type</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "flat", label: "Flat Rate", desc: "Fixed price for the load" },
            { value: "per_mile", label: "Per Mile", desc: "Rate multiplied by distance" },
            { value: "auction", label: "Auction", desc: "Let carriers bid" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => updateLoad({ rateType: type.value as LoadData["rateType"] })}
              className={cn(
                "p-4 rounded-lg border-2 transition-colors text-left",
                loadData.rateType === type.value
                  ? "border-green-500 bg-green-500/20"
                  : "border-slate-600 hover:border-slate-500"
              )}
            >
              <p className={cn("font-medium", loadData.rateType === type.value ? "text-green-400" : "text-white")}>
                {type.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {loadData.rateType === "flat" && (
        <div>
          <Label className="text-slate-300">Flat Rate ($)</Label>
          <Input
            type="number"
            value={loadData.flatRate || ""}
            onChange={(e) => updateLoad({ flatRate: Number(e.target.value) })}
            placeholder="1850"
            className="bg-slate-700/50 border-slate-600"
          />
        </div>
      )}

      {loadData.rateType === "per_mile" && (
        <div>
          <Label className="text-slate-300">Rate Per Mile ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={loadData.perMileRate || ""}
            onChange={(e) => updateLoad({ perMileRate: Number(e.target.value) })}
            placeholder="3.50"
            className="bg-slate-700/50 border-slate-600"
          />
        </div>
      )}

      {loadData.rateType === "auction" && (
        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Minimum Bid ($)</Label>
            <Input
              type="number"
              value={loadData.auctionMinBid || ""}
              onChange={(e) => updateLoad({ auctionMinBid: Number(e.target.value) })}
              placeholder="1500"
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
          <div>
            <Label className="text-slate-300">Bidding Deadline</Label>
            <Input
              type="datetime-local"
              value={loadData.auctionDeadline || ""}
              onChange={(e) => updateLoad({ auctionDeadline: e.target.value })}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>
        </div>
      )}

      <div>
        <Label className="text-slate-300">Special Instructions</Label>
        <textarea
          value={loadData.specialInstructions}
          onChange={(e) => updateLoad({ specialInstructions: e.target.value })}
          placeholder="Any special handling instructions, access codes, or notes..."
          className="w-full mt-1 p-3 rounded-md bg-slate-700/50 border border-slate-600 text-white h-24 resize-none"
        />
      </div>
    </div>
  );
}

// Step 7: Review
function Step7Review({ loadData }: { loadData: LoadData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-green-200">Review your load details before submitting</span>
      </div>

      {/* Product Info */}
      <div className="p-4 rounded-lg bg-slate-700/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-400" />
          Product Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Product</p>
            <p className="text-white">{loadData.productName || "Not specified"}</p>
          </div>
          <div>
            <p className="text-slate-400">Hazmat</p>
            <p className="text-white">
              {loadData.isHazmat ? (
                <Badge className="bg-red-500/20 text-red-400">
                  Class {loadData.hazmatClass} - {loadData.unNumber}
                </Badge>
              ) : "No"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Weight</p>
            <p className="text-white">{loadData.weight.toLocaleString()} {loadData.weightUnit}</p>
          </div>
          <div>
            <p className="text-slate-400">Quantity</p>
            <p className="text-white">{loadData.quantity.toLocaleString()} {loadData.quantityUnit}</p>
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="p-4 rounded-lg bg-slate-700/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" />
          Route
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
            <div>
              <p className="text-white font-medium">{loadData.origin.name || "Pickup"}</p>
              <p className="text-sm text-slate-400">
                {loadData.origin.city}, {loadData.origin.state}
              </p>
              <p className="text-xs text-slate-500">
                {loadData.pickupDate} {loadData.pickupTime}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
            <div>
              <p className="text-white font-medium">{loadData.destination.name || "Delivery"}</p>
              <p className="text-sm text-slate-400">
                {loadData.destination.city}, {loadData.destination.state}
              </p>
              <p className="text-xs text-slate-500">
                {loadData.deliveryDate} {loadData.deliveryTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment & Requirements */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-700/30">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-400" />
            Equipment
          </h4>
          <p className="text-sm text-slate-400">Type</p>
          <p className="text-white">{loadData.equipmentType || "Not specified"}</p>
          <p className="text-sm text-slate-400 mt-2">Length</p>
          <p className="text-white">{loadData.trailerLength ? `${loadData.trailerLength} ft` : "Not specified"}</p>
        </div>
        <div className="p-4 rounded-lg bg-slate-700/30">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Pricing
          </h4>
          <p className="text-sm text-slate-400">Rate Type</p>
          <p className="text-white capitalize">{loadData.rateType}</p>
          <p className="text-sm text-slate-400 mt-2">Amount</p>
          <p className="text-white text-lg font-bold">
            {loadData.rateType === "flat" && `$${loadData.flatRate?.toLocaleString() || 0}`}
            {loadData.rateType === "per_mile" && `$${loadData.perMileRate || 0}/mi`}
            {loadData.rateType === "auction" && `Min: $${loadData.auctionMinBid?.toLocaleString() || 0}`}
          </p>
        </div>
      </div>

      {/* Endorsements */}
      <div className="p-4 rounded-lg bg-slate-700/30">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Required Endorsements
        </h4>
        <div className="flex flex-wrap gap-2">
          {loadData.hazmatEndorsement && <Badge className="bg-red-500/20 text-red-400">Hazmat (H)</Badge>}
          {loadData.tankEndorsement && <Badge className="bg-blue-500/20 text-blue-400">Tank (N)</Badge>}
          {loadData.twicRequired && <Badge className="bg-purple-500/20 text-purple-400">TWIC</Badge>}
          {!loadData.hazmatEndorsement && !loadData.tankEndorsement && !loadData.twicRequired && (
            <span className="text-slate-400 text-sm">None required</span>
          )}
        </div>
      </div>
    </div>
  );
}
