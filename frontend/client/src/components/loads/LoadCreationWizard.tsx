/**
 * LOAD CREATION WIZARD
 * 7-step wizard for creating hazmat loads
 * Based on 01_SHIPPER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, 
  Package, MapPin, Truck, Shield, DollarSign, FileText,
  Sparkles, Search, Clock, Scale, Thermometer, Users
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Hazmat classes per DOT 49 CFR
const HAZMAT_CLASSES = [
  { value: "2.1", label: "2.1 - Flammable Gas", example: "Propane, Butane" },
  { value: "2.2", label: "2.2 - Non-Flammable Gas", example: "Nitrogen, Carbon Dioxide" },
  { value: "2.3", label: "2.3 - Poison Gas", example: "Chlorine, Ammonia" },
  { value: "3", label: "3 - Flammable Liquid", example: "Gasoline, Diesel, Ethanol" },
  { value: "4.1", label: "4.1 - Flammable Solid", example: "Matches, Sulfur" },
  { value: "4.2", label: "4.2 - Spontaneously Combustible", example: "White Phosphorus" },
  { value: "4.3", label: "4.3 - Dangerous When Wet", example: "Sodium, Potassium" },
  { value: "5.1", label: "5.1 - Oxidizer", example: "Ammonium Nitrate" },
  { value: "5.2", label: "5.2 - Organic Peroxide", example: "Benzoyl Peroxide" },
  { value: "6.1", label: "6.1 - Poison/Toxic", example: "Pesticides, Cyanide" },
  { value: "6.2", label: "6.2 - Infectious Substance", example: "Medical Waste" },
  { value: "7", label: "7 - Radioactive", example: "Uranium, Medical Isotopes" },
  { value: "8", label: "8 - Corrosive", example: "Sulfuric Acid, Battery Acid" },
  { value: "9", label: "9 - Miscellaneous", example: "Lithium Batteries, Dry Ice" },
];

const PACKING_GROUPS = [
  { value: "I", label: "Packing Group I - Great Danger" },
  { value: "II", label: "Packing Group II - Medium Danger" },
  { value: "III", label: "Packing Group III - Minor Danger" },
];

const CONTAINER_TYPES = [
  { value: "mc306", label: "MC-306 - Gasoline Tanker (Non-Pressure)" },
  { value: "mc307", label: "MC-307 - Chemical Tanker (Low Pressure)" },
  { value: "mc312", label: "MC-312 - Corrosive Tanker" },
  { value: "mc331", label: "MC-331 - Pressure Tank (LPG, Ammonia)" },
  { value: "mc338", label: "MC-338 - Cryogenic Tank" },
  { value: "dot407", label: "DOT-407 - General Chemical" },
  { value: "dot412", label: "DOT-412 - Corrosive Tank" },
  { value: "ibc", label: "IBC - Intermediate Bulk Container" },
  { value: "drums", label: "Drums (55 gallon)" },
  { value: "totes", label: "Totes" },
];

const EQUIPMENT_TYPES = [
  { value: "tanker", label: "Tanker Truck" },
  { value: "dryvan", label: "Dry Van" },
  { value: "flatbed", label: "Flatbed" },
  { value: "reefer", label: "Refrigerated" },
  { value: "lowboy", label: "Lowboy" },
  { value: "stepdeck", label: "Step Deck" },
];

interface LoadFormData {
  // Step 1: Hazmat Classification
  properShippingName: string;
  unNumber: string;
  hazardClass: string;
  packingGroup: string;
  subsidiaryHazards: string[];
  technicalName: string;
  isPoisonInhalation: boolean;
  isMarinePollutant: boolean;
  isLimitedQuantity: boolean;
  
  // Step 2: Quantity & Packaging
  quantity: string;
  quantityUnit: string;
  grossWeight: string;
  netWeight: string;
  containerType: string;
  packageCount: string;
  isBulk: boolean;
  isResidue: boolean;
  cargoValue: string;
  
  // Step 3: Origin & Destination
  originType: string;
  originAddress: string;
  originCity: string;
  originState: string;
  originZip: string;
  originFacilityName: string;
  pickupDateStart: string;
  pickupDateEnd: string;
  loadingRequirements: string[];
  
  destAddress: string;
  destCity: string;
  destState: string;
  destZip: string;
  destFacilityName: string;
  consigneeName: string;
  consigneePhone: string;
  deliveryDateStart: string;
  deliveryDateEnd: string;
  
  // Step 4: Equipment & Requirements
  equipmentType: string;
  tankSpecs: string;
  requiredEndorsements: string[];
  temperatureMin: string;
  temperatureMax: string;
  requiresEscort: boolean;
  specialEquipment: string[];
  
  // Step 5: Carrier Requirements
  minInsuranceCoverage: string;
  minSafetyRating: string;
  hazmatAuthRequired: boolean;
  preferredCarriers: string[];
  blockedCarriers: string[];
  contractOnly: boolean;
  
  // Step 6: Pricing & Bidding
  pricingStrategy: string;
  bookNowRate: string;
  minimumBid: string;
  targetRate: string;
  biddingDuration: string;
  accessorials: { name: string; rate: string }[];
  
  // Step 7: Review
  specialInstructions: string;
  acceptCompliance: boolean;
}

const initialFormData: LoadFormData = {
  properShippingName: "",
  unNumber: "",
  hazardClass: "",
  packingGroup: "",
  subsidiaryHazards: [],
  technicalName: "",
  isPoisonInhalation: false,
  isMarinePollutant: false,
  isLimitedQuantity: false,
  quantity: "",
  quantityUnit: "gallons",
  grossWeight: "",
  netWeight: "",
  containerType: "",
  packageCount: "1",
  isBulk: true,
  isResidue: false,
  cargoValue: "",
  originType: "facility",
  originAddress: "",
  originCity: "",
  originState: "",
  originZip: "",
  originFacilityName: "",
  pickupDateStart: "",
  pickupDateEnd: "",
  loadingRequirements: [],
  destAddress: "",
  destCity: "",
  destState: "",
  destZip: "",
  destFacilityName: "",
  consigneeName: "",
  consigneePhone: "",
  deliveryDateStart: "",
  deliveryDateEnd: "",
  equipmentType: "",
  tankSpecs: "",
  requiredEndorsements: [],
  temperatureMin: "",
  temperatureMax: "",
  requiresEscort: false,
  specialEquipment: [],
  minInsuranceCoverage: "1000000",
  minSafetyRating: "satisfactory",
  hazmatAuthRequired: true,
  preferredCarriers: [],
  blockedCarriers: [],
  contractOnly: false,
  pricingStrategy: "auction",
  bookNowRate: "",
  minimumBid: "",
  targetRate: "",
  biddingDuration: "24",
  accessorials: [],
  specialInstructions: "",
  acceptCompliance: false,
};

interface LoadCreationWizardProps {
  onComplete: (data: LoadFormData) => Promise<void>;
  onCancel: () => void;
}

export function LoadCreationWizard({ onComplete, onCancel }: LoadCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LoadFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const updateFormData = (updates: Partial<LoadFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const steps = [
    { id: "hazmat", title: "Hazmat Classification", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "quantity", title: "Quantity & Packaging", icon: <Package className="w-4 h-4" /> },
    { id: "locations", title: "Origin & Destination", icon: <MapPin className="w-4 h-4" /> },
    { id: "equipment", title: "Equipment Requirements", icon: <Truck className="w-4 h-4" /> },
    { id: "carrier", title: "Carrier Requirements", icon: <Shield className="w-4 h-4" /> },
    { id: "pricing", title: "Pricing & Bidding", icon: <DollarSign className="w-4 h-4" /> },
    { id: "review", title: "Review & Post", icon: <FileText className="w-4 h-4" /> },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // ESANG AI suggestion for hazmat classification
  const handleAISuggest = async () => {
    if (!formData.properShippingName) {
      toast.error("Please enter a product name first");
      return;
    }
    
    setAiSuggesting(true);
    try {
      // Simulate AI suggestion - in production, this would call the ESANG AI endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock AI response based on common products
      const productLower = formData.properShippingName.toLowerCase();
      let suggestion = { unNumber: "", hazardClass: "", packingGroup: "" };
      
      if (productLower.includes("gasoline") || productLower.includes("petrol")) {
        suggestion = { unNumber: "UN1203", hazardClass: "3", packingGroup: "II" };
      } else if (productLower.includes("diesel")) {
        suggestion = { unNumber: "UN1202", hazardClass: "3", packingGroup: "III" };
      } else if (productLower.includes("propane") || productLower.includes("lpg")) {
        suggestion = { unNumber: "UN1978", hazardClass: "2.1", packingGroup: "" };
      } else if (productLower.includes("sulfuric acid")) {
        suggestion = { unNumber: "UN1830", hazardClass: "8", packingGroup: "II" };
      } else if (productLower.includes("ammonia")) {
        suggestion = { unNumber: "UN1005", hazardClass: "2.3", packingGroup: "" };
      }
      
      if (suggestion.unNumber) {
        updateFormData(suggestion);
        toast.success("ESANG AI™ suggested classification applied");
      } else {
        toast.info("No automatic suggestion available. Please classify manually.");
      }
    } catch (error) {
      toast.error("AI suggestion failed");
    }
    setAiSuggesting(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.acceptCompliance) {
      toast.error("Please accept the compliance certification");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onComplete(formData);
      toast.success("Load posted successfully!");
    } catch (error) {
      toast.error("Failed to post load");
    }
    setIsSubmitting(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Hazmat Classification
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm text-purple-300 font-medium">ESANG AI™ Classification Assistant</p>
                  <p className="text-xs text-slate-400">Enter a product name and let AI suggest the hazmat classification</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleAISuggest}
                  disabled={aiSuggesting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {aiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suggest"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-slate-300">
                  Proper Shipping Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.properShippingName}
                  onChange={(e) => updateFormData({ properShippingName: e.target.value })}
                  placeholder="e.g., Gasoline, Diesel Fuel, Sulfuric Acid"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  UN/NA Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.unNumber}
                  onChange={(e) => updateFormData({ unNumber: e.target.value })}
                  placeholder="UN1203"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Technical Name (if required)</Label>
                <Input
                  value={formData.technicalName}
                  onChange={(e) => updateFormData({ technicalName: e.target.value })}
                  placeholder="Chemical formula or technical name"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  Hazard Class <span className="text-red-400">*</span>
                </Label>
                <Select value={formData.hazardClass} onValueChange={(v) => updateFormData({ hazardClass: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select hazard class" />
                  </SelectTrigger>
                  <SelectContent>
                    {HAZMAT_CLASSES.map((hc) => (
                      <SelectItem key={hc.value} value={hc.value}>
                        <div>
                          <span>{hc.label}</span>
                          <span className="text-xs text-slate-400 ml-2">({hc.example})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Packing Group</Label>
                <Select value={formData.packingGroup} onValueChange={(v) => updateFormData({ packingGroup: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Select packing group" />
                  </SelectTrigger>
                  <SelectContent>
                    {PACKING_GROUPS.map((pg) => (
                      <SelectItem key={pg.value} value={pg.value}>{pg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-300">Subsidiary Hazards / Special Designations</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
                  <Checkbox
                    id="pih"
                    checked={formData.isPoisonInhalation}
                    onCheckedChange={(c) => updateFormData({ isPoisonInhalation: c as boolean })}
                  />
                  <Label htmlFor="pih" className="text-sm text-slate-300 cursor-pointer">
                    Poison Inhalation Hazard (PIH)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
                  <Checkbox
                    id="marine"
                    checked={formData.isMarinePollutant}
                    onCheckedChange={(c) => updateFormData({ isMarinePollutant: c as boolean })}
                  />
                  <Label htmlFor="marine" className="text-sm text-slate-300 cursor-pointer">
                    Marine Pollutant
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
                  <Checkbox
                    id="limited"
                    checked={formData.isLimitedQuantity}
                    onCheckedChange={(c) => updateFormData({ isLimitedQuantity: c as boolean })}
                  />
                  <Label htmlFor="limited" className="text-sm text-slate-300 cursor-pointer">
                    Limited Quantity
                  </Label>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Quantity & Packaging
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  Quantity <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => updateFormData({ quantity: e.target.value })}
                  placeholder="5000"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Unit</Label>
                <Select value={formData.quantityUnit} onValueChange={(v) => updateFormData({ quantityUnit: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="barrels">Barrels</SelectItem>
                    <SelectItem value="pounds">Pounds</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="tons">Tons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Package Count</Label>
                <Input
                  type="number"
                  value={formData.packageCount}
                  onChange={(e) => updateFormData({ packageCount: e.target.value })}
                  placeholder="1"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Gross Weight (lbs)</Label>
                <Input
                  type="number"
                  value={formData.grossWeight}
                  onChange={(e) => updateFormData({ grossWeight: e.target.value })}
                  placeholder="42000"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Net Weight (lbs)</Label>
                <Input
                  type="number"
                  value={formData.netWeight}
                  onChange={(e) => updateFormData({ netWeight: e.target.value })}
                  placeholder="40000"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                Container Type <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.containerType} onValueChange={(v) => updateFormData({ containerType: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select container type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
                <Checkbox
                  id="bulk"
                  checked={formData.isBulk}
                  onCheckedChange={(c) => updateFormData({ isBulk: c as boolean })}
                />
                <Label htmlFor="bulk" className="text-sm text-slate-300 cursor-pointer">Bulk Shipment</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
                <Checkbox
                  id="residue"
                  checked={formData.isResidue}
                  onCheckedChange={(c) => updateFormData({ isResidue: c as boolean })}
                />
                <Label htmlFor="residue" className="text-sm text-slate-300 cursor-pointer">Residue</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Cargo Value ($)</Label>
                <Input
                  type="number"
                  value={formData.cargoValue}
                  onChange={(e) => updateFormData({ cargoValue: e.target.value })}
                  placeholder="100000"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Origin & Destination
        return (
          <div className="space-y-6">
            <Tabs defaultValue="origin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger value="origin">Origin / Pickup</TabsTrigger>
                <TabsTrigger value="destination">Destination / Delivery</TabsTrigger>
              </TabsList>
              
              <TabsContent value="origin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Facility Name</Label>
                  <Input
                    value={formData.originFacilityName}
                    onChange={(e) => updateFormData({ originFacilityName: e.target.value })}
                    placeholder="ABC Chemical Terminal"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Street Address <span className="text-red-400">*</span></Label>
                  <Input
                    value={formData.originAddress}
                    onChange={(e) => updateFormData({ originAddress: e.target.value })}
                    placeholder="123 Industrial Blvd"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">City <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.originCity}
                      onChange={(e) => updateFormData({ originCity: e.target.value })}
                      placeholder="Houston"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">State <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.originState}
                      onChange={(e) => updateFormData({ originState: e.target.value })}
                      placeholder="TX"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">ZIP <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.originZip}
                      onChange={(e) => updateFormData({ originZip: e.target.value })}
                      placeholder="77001"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Pickup Earliest <span className="text-red-400">*</span></Label>
                    <Input
                      type="datetime-local"
                      value={formData.pickupDateStart}
                      onChange={(e) => updateFormData({ pickupDateStart: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Pickup Latest</Label>
                    <Input
                      type="datetime-local"
                      value={formData.pickupDateEnd}
                      onChange={(e) => updateFormData({ pickupDateEnd: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Loading Requirements</Label>
                  <div className="flex flex-wrap gap-2">
                    {["TWIC Required", "Driver Assist", "Pump-Off", "Live Load", "Drop Trailer"].map((req) => (
                      <Badge 
                        key={req}
                        variant={formData.loadingRequirements.includes(req) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (formData.loadingRequirements.includes(req)) {
                            updateFormData({ loadingRequirements: formData.loadingRequirements.filter(r => r !== req) });
                          } else {
                            updateFormData({ loadingRequirements: [...formData.loadingRequirements, req] });
                          }
                        }}
                      >
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="destination" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Facility / Consignee Name</Label>
                  <Input
                    value={formData.destFacilityName}
                    onChange={(e) => updateFormData({ destFacilityName: e.target.value })}
                    placeholder="XYZ Refinery"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Street Address <span className="text-red-400">*</span></Label>
                  <Input
                    value={formData.destAddress}
                    onChange={(e) => updateFormData({ destAddress: e.target.value })}
                    placeholder="456 Refinery Road"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">City <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.destCity}
                      onChange={(e) => updateFormData({ destCity: e.target.value })}
                      placeholder="Dallas"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">State <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.destState}
                      onChange={(e) => updateFormData({ destState: e.target.value })}
                      placeholder="TX"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">ZIP <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.destZip}
                      onChange={(e) => updateFormData({ destZip: e.target.value })}
                      placeholder="75001"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Delivery Earliest <span className="text-red-400">*</span></Label>
                    <Input
                      type="datetime-local"
                      value={formData.deliveryDateStart}
                      onChange={(e) => updateFormData({ deliveryDateStart: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Delivery Latest</Label>
                    <Input
                      type="datetime-local"
                      value={formData.deliveryDateEnd}
                      onChange={(e) => updateFormData({ deliveryDateEnd: e.target.value })}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 3: // Equipment & Requirements
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">
                Equipment Type <span className="text-red-400">*</span>
              </Label>
              <Select value={formData.equipmentType} onValueChange={(v) => updateFormData({ equipmentType: v })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select equipment type" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <SelectItem key={eq.value} value={eq.value}>{eq.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Required Endorsements</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: "H", label: "Hazmat (H)" },
                  { code: "N", label: "Tanker (N)" },
                  { code: "X", label: "Hazmat + Tanker (X)" },
                ].map((end) => (
                  <Badge 
                    key={end.code}
                    variant={formData.requiredEndorsements.includes(end.code) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (formData.requiredEndorsements.includes(end.code)) {
                        updateFormData({ requiredEndorsements: formData.requiredEndorsements.filter(e => e !== end.code) });
                      } else {
                        updateFormData({ requiredEndorsements: [...formData.requiredEndorsements, end.code] });
                      }
                    }}
                  >
                    {end.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Temperature Min (°F)</Label>
                <Input
                  type="number"
                  value={formData.temperatureMin}
                  onChange={(e) => updateFormData({ temperatureMin: e.target.value })}
                  placeholder="Leave blank if N/A"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Temperature Max (°F)</Label>
                <Input
                  type="number"
                  value={formData.temperatureMax}
                  onChange={(e) => updateFormData({ temperatureMax: e.target.value })}
                  placeholder="Leave blank if N/A"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Checkbox
                id="escort"
                checked={formData.requiresEscort}
                onCheckedChange={(c) => updateFormData({ requiresEscort: c as boolean })}
              />
              <Label htmlFor="escort" className="text-sm text-yellow-300 cursor-pointer">
                Requires Escort / Pilot Vehicle (oversized or special routing)
              </Label>
            </div>
          </div>
        );

      case 4: // Carrier Requirements
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Minimum Insurance Coverage</Label>
                <Select value={formData.minInsuranceCoverage} onValueChange={(v) => updateFormData({ minInsuranceCoverage: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="750000">$750,000</SelectItem>
                    <SelectItem value="1000000">$1,000,000</SelectItem>
                    <SelectItem value="2000000">$2,000,000</SelectItem>
                    <SelectItem value="5000000">$5,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Minimum Safety Rating</Label>
                <Select value={formData.minSafetyRating} onValueChange={(v) => updateFormData({ minSafetyRating: v })}>
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="satisfactory">Satisfactory or Better</SelectItem>
                    <SelectItem value="conditional">Conditional or Better</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
              <Checkbox
                id="hazmatAuth"
                checked={formData.hazmatAuthRequired}
                onCheckedChange={(c) => updateFormData({ hazmatAuthRequired: c as boolean })}
              />
              <Label htmlFor="hazmatAuth" className="text-sm text-slate-300 cursor-pointer">
                Require verified Hazmat Operating Authority
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-700/30">
              <Checkbox
                id="contractOnly"
                checked={formData.contractOnly}
                onCheckedChange={(c) => updateFormData({ contractOnly: c as boolean })}
              />
              <Label htmlFor="contractOnly" className="text-sm text-slate-300 cursor-pointer">
                Only tender to contracted carriers
              </Label>
            </div>
          </div>
        );

      case 5: // Pricing & Bidding
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Pricing Strategy</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "book_now", label: "Book Now", desc: "Fixed price, instant award" },
                  { value: "first_bid", label: "Accept First", desc: "First qualifying bid wins" },
                  { value: "auction", label: "Auction", desc: "Competitive bidding" },
                  { value: "tender", label: "Contract Tender", desc: "Tender to carriers" },
                ].map((strategy) => (
                  <div
                    key={strategy.value}
                    onClick={() => updateFormData({ pricingStrategy: strategy.value })}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      formData.pricingStrategy === strategy.value
                        ? "bg-blue-500/20 border-blue-500"
                        : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                    )}
                  >
                    <p className="text-sm font-medium text-white">{strategy.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{strategy.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {formData.pricingStrategy === "book_now" && (
              <div className="space-y-2">
                <Label className="text-slate-300">Book Now Rate ($)</Label>
                <Input
                  type="number"
                  value={formData.bookNowRate}
                  onChange={(e) => updateFormData({ bookNowRate: e.target.value })}
                  placeholder="2500"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            )}

            {(formData.pricingStrategy === "auction" || formData.pricingStrategy === "first_bid") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Target Rate ($)</Label>
                  <Input
                    type="number"
                    value={formData.targetRate}
                    onChange={(e) => updateFormData({ targetRate: e.target.value })}
                    placeholder="2800"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Minimum Acceptable ($)</Label>
                  <Input
                    type="number"
                    value={formData.minimumBid}
                    onChange={(e) => updateFormData({ minimumBid: e.target.value })}
                    placeholder="2200"
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Bidding Duration</Label>
                  <Select value={formData.biddingDuration} onValueChange={(v) => updateFormData({ biddingDuration: v })}>
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">AI Suggested Rate</span>
              </div>
              <p className="text-lg text-white font-bold">$2,650 - $2,900</p>
              <p className="text-xs text-slate-400">Based on current market rates for this lane</p>
            </div>
          </div>
        );

      case 6: // Review
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Commodity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white">{formData.properShippingName || "Not specified"}</p>
                  <p className="text-sm text-slate-400">{formData.unNumber} • Class {formData.hazardClass}</p>
                  <p className="text-sm text-slate-400">{formData.quantity} {formData.quantityUnit}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Route</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white">{formData.originCity}, {formData.originState}</p>
                  <p className="text-sm text-slate-400">→ {formData.destCity}, {formData.destState}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white">{formData.equipmentType || "Not specified"}</p>
                  <p className="text-sm text-slate-400">Container: {formData.containerType}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-400">Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-white capitalize">{formData.pricingStrategy.replace("_", " ")}</p>
                  <p className="text-sm text-slate-400">
                    {formData.bookNowRate && `$${formData.bookNowRate} fixed`}
                    {formData.targetRate && `Target: $${formData.targetRate}`}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Special Instructions</Label>
              <Textarea
                value={formData.specialInstructions}
                onChange={(e) => updateFormData({ specialInstructions: e.target.value })}
                placeholder="Any additional instructions for the carrier..."
                className="bg-slate-700/50 border-slate-600 text-white"
                rows={3}
              />
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="compliance"
                  checked={formData.acceptCompliance}
                  onCheckedChange={(c) => updateFormData({ acceptCompliance: c as boolean })}
                />
                <Label htmlFor="compliance" className="text-sm text-yellow-300 cursor-pointer">
                  I certify that this shipment complies with all applicable DOT 49 CFR, PHMSA, and EPA regulations.
                  All hazmat classifications, packaging, and documentation are accurate.
                  <span className="text-red-400"> *</span>
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Load</h1>
          <p className="text-slate-400">Post a hazmat load to the marketplace</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
                index === currentStep && "bg-blue-500/20 text-blue-400",
                index < currentStep && "bg-green-500/20 text-green-400",
                index > currentStep && "bg-slate-700/50 text-slate-500"
              )}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack} className="border-slate-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>

          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Post Load
            </Button>
          ) : (
            <Button onClick={handleNext} className="bg-gradient-to-r from-blue-500 to-purple-600">
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoadCreationWizard;
