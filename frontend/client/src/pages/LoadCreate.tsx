/**
 * CREATE LOAD PAGE - SHIPPER ROLE
 * Multi-step wizard for posting new shipment loads
 * Professional 5-step flow with validation and real-time preview
 */

import { useState, useRef, useEffect } from "react";
import AddressAutocomplete, { ParsedAddress } from "@/components/AddressAutocomplete";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Package, MapPin, Calendar, DollarSign, FileText,
  ArrowRight, ArrowLeft, Check, AlertCircle, Truck,
  Info, Upload, X, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { EsangIcon } from "@/components/EsangIcon";

type Step = "details" | "locations" | "schedule" | "pricing" | "review";

export default function LoadCreatePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>("details");

  // ERG search (ESANG AI powered)
  const [ergQ, setErgQ] = useState("");
  const [showErg, setShowErg] = useState(false);
  const ergSuggestRef = useRef<HTMLDivElement>(null);
  const ergRes = (trpc as any).erg?.search?.useQuery?.(
    { query: ergQ, limit: 8 },
    { enabled: ergQ.length >= 2, staleTime: 30000 }
  ) || { data: null, isLoading: false };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ergSuggestRef.current && !ergSuggestRef.current.contains(e.target as Node)) setShowErg(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Form state
  const [formData, setFormData] = useState<{
    cargoType: "general" | "hazmat" | "refrigerated" | "oversized" | "liquid" | "gas" | "chemicals" | "petroleum";
    hazmatClass: string;
    unNumber: string;
    weight: string;
    weightUnit: string;
    volume: string;
    volumeUnit: string;
    pickupAddress: string;
    pickupCity: string;
    pickupState: string;
    pickupZip: string;
    pickupLat: number;
    pickupLng: number;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryZip: string;
    deliveryLat: number;
    deliveryLng: number;
    pickupDate: string;
    deliveryDate: string;
    rate: string;
    currency: string;
    specialInstructions: string;
  }>({
    cargoType: "general",
    hazmatClass: "",
    unNumber: "",
    weight: "",
    weightUnit: "lbs",
    volume: "",
    volumeUnit: "gal",
    pickupAddress: "",
    pickupCity: "",
    pickupState: "",
    pickupZip: "",
    pickupLat: 0,
    pickupLng: 0,
    deliveryAddress: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryZip: "",
    deliveryLat: 0,
    deliveryLng: 0,
    pickupDate: "",
    deliveryDate: "",
    rate: "",
    currency: "USD",
    specialInstructions: "",
  });

  const createLoadMutation = (trpc as any).loads.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Load created successfully!");
      setLocation(`/loads/${data.loadId}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create load: ${error.message}`);
    },
  });

  const steps: { id: Step; title: string; icon: any; description: string }[] = [
    { id: "details", title: "Load Details", icon: Package, description: "Cargo type and specifications" },
    { id: "locations", title: "Locations", icon: MapPin, description: "Pickup and delivery addresses" },
    { id: "schedule", title: "Schedule", icon: Calendar, description: "Pickup and delivery times" },
    { id: "pricing", title: "Pricing", icon: DollarSign, description: "Rate and special instructions" },
    { id: "review", title: "Review", icon: FileText, description: "Review and submit" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case "details":
        if (!formData.cargoType) {
          toast.error("Please select a cargo type");
          return false;
        }
        if (formData.cargoType === "hazmat" && (!formData.hazmatClass || !formData.unNumber)) {
          toast.error("HazMat loads require class and UN number");
          return false;
        }
        return true;
      case "locations":
        if (!formData.pickupCity || !formData.pickupState || !formData.deliveryCity || !formData.deliveryState) {
          toast.error("Please complete all location fields");
          return false;
        }
        return true;
      case "schedule":
        if (!formData.pickupDate) {
          toast.error("Please select a pickup date");
          return false;
        }
        return true;
      case "pricing":
        if (!formData.rate || Number(formData.rate) <= 0) {
          toast.error("Please enter a valid rate");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStep(steps[currentStepIndex + 1].id);
      }
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = () => {
    if (!validateStep("pricing")) return;

    createLoadMutation.mutate({
      cargoType: formData.cargoType,
      hazmatClass: formData.hazmatClass || undefined,
      unNumber: formData.unNumber || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      weightUnit: formData.weightUnit,
      volume: formData.volume ? parseFloat(formData.volume) : undefined,
      volumeUnit: formData.volumeUnit,
      pickupLocation: {
        address: formData.pickupAddress,
        city: formData.pickupCity,
        state: formData.pickupState,
        zipCode: formData.pickupZip,
        lat: formData.pickupLat || 0,
        lng: formData.pickupLng || 0,
      },
      deliveryLocation: {
        address: formData.deliveryAddress,
        city: formData.deliveryCity,
        state: formData.deliveryState,
        zipCode: formData.deliveryZip,
        lat: formData.deliveryLat || 0,
        lng: formData.deliveryLng || 0,
      },
      pickupDate: formData.pickupDate ? new Date(formData.pickupDate) : undefined,
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      currency: formData.currency,
      specialInstructions: formData.specialInstructions || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Create New Load
          </h1>
          <p className="text-slate-400 text-lg">Post a new shipment to the EusoTrip marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-800 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step: any, index: number) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 ${
                      isCompleted
                        ? "bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-500/50"
                        : isActive
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/50 scale-110"
                        : "bg-gray-800 border-2 border-gray-700"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7" />
                    ) : (
                      <Icon className="w-7 h-7" />
                    )}
                  </div>
                  <p className={`text-sm font-semibold mb-1 ${isActive ? "text-white" : "text-slate-400"}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-500 text-center max-w-[120px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="bg-gray-900/50 border-gray-800 p-8 backdrop-blur-sm">
          {currentStep === "details" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Load Details</h2>
                  <p className="text-slate-400">Specify cargo type and specifications</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Cargo Type *</label>
                <select
                  value={formData.cargoType}
                  onChange={(e: any) => setFormData({ ...formData, cargoType: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="general">General Freight</option>
                  <option value="hazmat">Hazardous Materials (HazMat)</option>
                  <option value="refrigerated">Refrigerated</option>
                  <option value="oversized">Oversized</option>
                  <option value="liquid">Liquid</option>
                  <option value="gas">Gas</option>
                  <option value="chemicals">Chemicals</option>
                  <option value="petroleum">Petroleum</option>
                </select>
              </div>

              {formData.cargoType === "hazmat" && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    <p className="text-sm font-semibold text-yellow-300">HazMat Compliance Required</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">HazMat Class *</label>
                      <Input
                        value={formData.hazmatClass}
                        onChange={(e: any) => setFormData({ ...formData, hazmatClass: e.target.value })}
                        placeholder="e.g., Class 3"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div ref={ergSuggestRef} className="relative">
                      <label className="block text-sm font-medium mb-2 text-slate-300">UN Number *</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            value={formData.unNumber}
                            onChange={(e: any) => {
                              setFormData({ ...formData, unNumber: e.target.value });
                              const v = e.target.value.replace(/^un/i, "").trim();
                              if (v.length >= 2) { setErgQ(v); setShowErg(true); } else setShowErg(false);
                            }}
                            onFocus={() => { if (ergQ.length >= 2) setShowErg(true); }}
                            placeholder="e.g., UN1203"
                            className="bg-gray-800 border-gray-700 pl-10"
                          />
                        </div>
                        <Button variant="outline" size="sm" className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30" onClick={() => {
                          if (formData.unNumber?.trim().length >= 2) { setErgQ(formData.unNumber.replace(/^un/i, "").trim()); setShowErg(true); }
                        }}>
                          <EsangIcon className="w-4 h-4" />
                        </Button>
                      </div>
                      {showErg && ergRes?.data?.results?.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                          <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wide border-b border-slate-700/50">ERG 2024 — {ergRes.data.count} results</div>
                          {ergRes.data.results.map((m: any, i: number) => (
                            <button key={`${m.unNumber}-${i}`} className="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between gap-2 border-b border-slate-700/20 last:border-0 transition-colors" onClick={() => {
                              setFormData({ ...formData, unNumber: `UN${m.unNumber}`, hazmatClass: `Class ${m.hazardClass}` });
                              setShowErg(false);
                              toast.success("ESANG AI — Product Verified", { description: `${m.name} — UN${m.unNumber} (Class ${m.hazardClass}) Guide ${m.guide}` });
                            }}>
                              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{m.name}</p></div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">UN{m.unNumber}</Badge>
                                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Class {m.hazardClass}</Badge>
                                <Badge variant="outline" className="text-[10px] border-slate-500/30 text-slate-400">G{m.guide}</Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {showErg && ergQ.length >= 2 && ergRes?.isLoading && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl p-3">
                          <div className="flex items-center gap-2 text-slate-400 text-sm"><EsangIcon className="w-4 h-4 animate-spin" />Searching ERG 2024...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Weight</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e: any) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="Enter weight"
                      className="bg-gray-800 border-gray-700"
                    />
                    <select
                      value={formData.weightUnit}
                      onChange={(e: any) => setFormData({ ...formData, weightUnit: e.target.value })}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Volume</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.volume}
                      onChange={(e: any) => setFormData({ ...formData, volume: e.target.value })}
                      placeholder="Enter volume"
                      className="bg-gray-800 border-gray-700"
                    />
                    <select
                      value={formData.volumeUnit}
                      onChange={(e: any) => setFormData({ ...formData, volumeUnit: e.target.value })}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="gal">gal</option>
                      <option value="L">L</option>
                      <option value="bbl">bbl</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Pro Tip</p>
                  <p>Accurate weight and volume specifications help catalysts provide better bids and prevent delays.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === "locations" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Pickup & Delivery Locations</h2>
                  <p className="text-slate-400">Enter complete addresses for accurate routing</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/50 rounded-lg p-6">
                <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2 text-lg">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Pickup Location
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Street Address</label>
                    <AddressAutocomplete
                      value={formData.pickupAddress}
                      onChange={(v) => setFormData({ ...formData, pickupAddress: v })}
                      onSelect={(parsed: ParsedAddress) => setFormData({ ...formData, pickupAddress: parsed.address, pickupCity: parsed.city, pickupState: parsed.state, pickupZip: parsed.zip, pickupLat: parsed.lat, pickupLng: parsed.lng })}
                      placeholder="Start typing an address..."
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">City *</label>
                      <Input
                        value={formData.pickupCity}
                        onChange={(e: any) => setFormData({ ...formData, pickupCity: e.target.value })}
                        placeholder="City"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">State *</label>
                      <Input
                        value={formData.pickupState}
                        onChange={(e: any) => setFormData({ ...formData, pickupState: e.target.value })}
                        placeholder="State"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">ZIP Code</label>
                      <Input
                        value={formData.pickupZip}
                        onChange={(e: any) => setFormData({ ...formData, pickupZip: e.target.value })}
                        placeholder="ZIP"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/50 rounded-lg p-6">
                <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2 text-lg">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Delivery Location
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Street Address</label>
                    <AddressAutocomplete
                      value={formData.deliveryAddress}
                      onChange={(v) => setFormData({ ...formData, deliveryAddress: v })}
                      onSelect={(parsed: ParsedAddress) => setFormData({ ...formData, deliveryAddress: parsed.address, deliveryCity: parsed.city, deliveryState: parsed.state, deliveryZip: parsed.zip, deliveryLat: parsed.lat, deliveryLng: parsed.lng })}
                      placeholder="Start typing an address..."
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">City *</label>
                      <Input
                        value={formData.deliveryCity}
                        onChange={(e: any) => setFormData({ ...formData, deliveryCity: e.target.value })}
                        placeholder="City"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">State *</label>
                      <Input
                        value={formData.deliveryState}
                        onChange={(e: any) => setFormData({ ...formData, deliveryState: e.target.value })}
                        placeholder="State"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">ZIP Code</label>
                      <Input
                        value={formData.deliveryZip}
                        onChange={(e: any) => setFormData({ ...formData, deliveryZip: e.target.value })}
                        placeholder="ZIP"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === "schedule" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Pickup & Delivery Schedule</h2>
                  <p className="text-slate-400">Set your preferred dates and times</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Pickup Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.pickupDate}
                    onChange={(e: any) => setFormData({ ...formData, pickupDate: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Delivery Date & Time (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.deliveryDate}
                    onChange={(e: any) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Scheduling Tips</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Account for loading/unloading time at both locations</li>
                    <li>Consider driver rest periods for long-haul loads</li>
                    <li>Allow buffer time for unexpected delays</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === "pricing" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Pricing & Instructions</h2>
                  <p className="text-slate-400">Set your rate and add special requirements</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Rate (USD) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e: any) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="Enter your rate"
                    className="pl-12 bg-gray-800 border-gray-700 text-lg"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">This is the total amount you're willing to pay for this shipment</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Special Instructions</label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e: any) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  placeholder="Any special handling requirements, access codes, contact information, equipment needs, etc."
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-green-400 mt-0.5" />
                <div className="text-sm text-green-300">
                  <p className="font-semibold mb-1">Pricing Recommendations</p>
                  <p>Competitive rates attract more qualified catalysts. Consider market rates for similar routes and cargo types.</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Review & Submit</h2>
                  <p className="text-slate-400">Verify all details before posting your load</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-blue-400" />
                    Load Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Cargo Type</p>
                      <p className="font-medium capitalize">{formData.cargoType}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Weight</p>
                      <p className="font-medium">{formData.weight} {formData.weightUnit}</p>
                    </div>
                    {formData.volume && (
                      <div>
                        <p className="text-slate-500">Volume</p>
                        <p className="font-medium">{formData.volume} {formData.volumeUnit}</p>
                      </div>
                    )}
                    {formData.cargoType === "hazmat" && (
                      <>
                        <div>
                          <p className="text-slate-500">HazMat Class</p>
                          <p className="font-medium">{formData.hazmatClass}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">UN Number</p>
                          <p className="font-medium">{formData.unNumber}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    Route
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                      <div>
                        <p className="text-slate-500 text-sm">Pickup</p>
                        <p className="font-medium">{formData.pickupCity}, {formData.pickupState} {formData.pickupZip}</p>
                        {formData.pickupAddress && <p className="text-sm text-slate-400">{formData.pickupAddress}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1"></div>
                      <div>
                        <p className="text-slate-500 text-sm">Delivery</p>
                        <p className="font-medium">{formData.deliveryCity}, {formData.deliveryState} {formData.deliveryZip}</p>
                        {formData.deliveryAddress && <p className="text-sm text-slate-400">{formData.deliveryAddress}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Pickup Date</p>
                      <p className="font-medium">{formData.pickupDate ? new Date(formData.pickupDate).toLocaleString() : "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Delivery Date</p>
                      <p className="font-medium">{formData.deliveryDate ? new Date(formData.deliveryDate).toLocaleString() : "Flexible"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-lg p-5 border border-green-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Pricing
                  </h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent">${formData.rate}</p>
                  {formData.specialInstructions && (
                    <div className="mt-4">
                      <p className="text-slate-500 text-sm mb-1">Special Instructions</p>
                      <p className="text-sm text-slate-300">{formData.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="border-gray-700 hover:border-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={handleSubmit}
                disabled={createLoadMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
                size="lg"
              >
                {createLoadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Load...
                  </>
                ) : (
                  <>
                    Submit Load
                    <Check className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
