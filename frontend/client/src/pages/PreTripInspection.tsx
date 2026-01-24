/**
 * PRE-TRIP INSPECTION
 * Comprehensive pre-trip inspection checklist for drivers per DOT/FMCSA regulations
 * Based on 04_DRIVER_USER_JOURNEY.md
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  CheckCircle, XCircle, AlertTriangle, Camera, Truck, 
  ChevronRight, ChevronLeft, Clock, MapPin, Gauge, 
  Thermometer, Shield, FileText, Send, CircleDot, Eye,
  Zap, Droplets, Wind, Settings, Radio, TriangleAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type InspectionStatus = "pass" | "fail" | "na" | null;

interface InspectionItem {
  id: string;
  label: string;
  description?: string;
  status: InspectionStatus;
  notes?: string;
  photoRequired?: boolean;
  photoUrl?: string;
}

interface InspectionCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: InspectionItem[];
}

const INITIAL_CATEGORIES: InspectionCategory[] = [
  {
    id: "cab",
    title: "Cab & Engine",
    icon: Truck,
    items: [
      { id: "cab_1", label: "Engine oil level", status: null },
      { id: "cab_2", label: "Coolant level", status: null },
      { id: "cab_3", label: "Power steering fluid", status: null },
      { id: "cab_4", label: "Windshield washer fluid", status: null },
      { id: "cab_5", label: "Air filter condition", status: null },
      { id: "cab_6", label: "Belts and hoses", status: null },
      { id: "cab_7", label: "Leaks (oil, coolant, fuel)", status: null },
      { id: "cab_8", label: "Battery terminals", status: null },
      { id: "cab_9", label: "Mirrors (clean, adjusted)", status: null },
      { id: "cab_10", label: "Windshield (clean, no cracks)", status: null },
      { id: "cab_11", label: "Wipers functional", status: null },
      { id: "cab_12", label: "Horn functional", status: null },
    ],
  },
  {
    id: "lights",
    title: "Lights & Signals",
    icon: Zap,
    items: [
      { id: "lights_1", label: "Headlights (high/low)", status: null },
      { id: "lights_2", label: "Turn signals (front)", status: null },
      { id: "lights_3", label: "Turn signals (rear)", status: null },
      { id: "lights_4", label: "Brake lights", status: null },
      { id: "lights_5", label: "Tail lights", status: null },
      { id: "lights_6", label: "Clearance lights", status: null },
      { id: "lights_7", label: "Marker lights", status: null },
      { id: "lights_8", label: "Reflectors", status: null },
      { id: "lights_9", label: "Hazard lights", status: null },
      { id: "lights_10", label: "License plate light", status: null },
    ],
  },
  {
    id: "brakes",
    title: "Brakes & Air System",
    icon: CircleDot,
    items: [
      { id: "brakes_1", label: "Air pressure buildup (90-120 psi)", status: null },
      { id: "brakes_2", label: "Low air warning (activates ~60 psi)", status: null },
      { id: "brakes_3", label: "Air leakage test (< 3 psi/min)", status: null },
      { id: "brakes_4", label: "Service brake test", status: null },
      { id: "brakes_5", label: "Parking brake test", status: null },
      { id: "brakes_6", label: "Brake pads/shoes condition", status: null },
      { id: "brakes_7", label: "Brake drums/rotors", status: null },
      { id: "brakes_8", label: "Air lines and connections", status: null },
      { id: "brakes_9", label: "Slack adjusters", status: null },
      { id: "brakes_10", label: "ABS indicator light", status: null },
    ],
  },
  {
    id: "tires",
    title: "Tires & Wheels",
    icon: Settings,
    items: [
      { id: "tires_1", label: "Tire pressure (all tires)", status: null },
      { id: "tires_2", label: "Tread depth (4/32\" min steer, 2/32\" drive)", status: null },
      { id: "tires_3", label: "Tire condition (cuts, bulges, wear)", status: null },
      { id: "tires_4", label: "Lug nuts torqued", status: null },
      { id: "tires_5", label: "Valve stems and caps", status: null },
      { id: "tires_6", label: "Wheel seals (no leaks)", status: null },
      { id: "tires_7", label: "Hub oil level", status: null },
      { id: "tires_8", label: "Matching tires on dual wheels", status: null },
    ],
  },
  {
    id: "coupling",
    title: "Coupling & Trailer",
    icon: Truck,
    items: [
      { id: "coupling_1", label: "Fifth wheel locked", status: null },
      { id: "coupling_2", label: "Kingpin engaged", status: null },
      { id: "coupling_3", label: "Fifth wheel greased", status: null },
      { id: "coupling_4", label: "Air lines connected", status: null },
      { id: "coupling_5", label: "Electrical connection", status: null },
      { id: "coupling_6", label: "Landing gear raised/secured", status: null },
      { id: "coupling_7", label: "Tug test performed", status: null },
      { id: "coupling_8", label: "Trailer lights functional", status: null },
    ],
  },
  {
    id: "tank",
    title: "Tank Specific",
    icon: Droplets,
    items: [
      { id: "tank_1", label: "Tank integrity (no dents, damage)", status: null },
      { id: "tank_2", label: "Manhole covers sealed", status: null },
      { id: "tank_3", label: "Valves closed and capped", status: null },
      { id: "tank_4", label: "Emergency shutoffs accessible", status: null },
      { id: "tank_5", label: "Vapor recovery system", status: null },
      { id: "tank_6", label: "Grounding cable present", status: null },
      { id: "tank_7", label: "Placards correct and visible", status: null, photoRequired: true },
      { id: "tank_8", label: "UN numbers displayed", status: null },
      { id: "tank_9", label: "Product labels accurate", status: null },
      { id: "tank_10", label: "Spill kit on board", status: null },
    ],
  },
  {
    id: "safety",
    title: "Safety Equipment",
    icon: Shield,
    items: [
      { id: "safety_1", label: "Fire extinguisher (charged)", status: null },
      { id: "safety_2", label: "Warning triangles (3)", status: null },
      { id: "safety_3", label: "First aid kit", status: null },
      { id: "safety_4", label: "PPE (gloves, goggles, boots)", status: null },
      { id: "safety_5", label: "ERG guidebook", status: null },
      { id: "safety_6", label: "Shipping papers accessible", status: null },
      { id: "safety_7", label: "Emergency contact numbers", status: null },
      { id: "safety_8", label: "Seat belt functional", status: null },
    ],
  },
  {
    id: "instruments",
    title: "Instruments & Gauges",
    icon: Gauge,
    items: [
      { id: "instr_1", label: "Speedometer functional", status: null },
      { id: "instr_2", label: "Odometer reading recorded", status: null },
      { id: "instr_3", label: "Fuel gauge accurate", status: null },
      { id: "instr_4", label: "Temperature gauge", status: null },
      { id: "instr_5", label: "Oil pressure gauge", status: null },
      { id: "instr_6", label: "Voltmeter/ammeter", status: null },
      { id: "instr_7", label: "Air pressure gauges", status: null },
      { id: "instr_8", label: "ELD device connected", status: null },
      { id: "instr_9", label: "GPS functional", status: null },
    ],
  },
];

export default function PreTripInspection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [categories, setCategories] = useState<InspectionCategory[]>(INITIAL_CATEGORIES);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [vehicleInfo, setVehicleInfo] = useState({
    truckNumber: "",
    trailerNumber: "",
    odometer: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const currentCategory = categories[currentCategoryIndex];

  const updateItemStatus = (categoryId: string, itemId: string, status: InspectionStatus) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          ),
        };
      }
      return cat;
    }));
  };

  const updateItemNotes = (categoryId: string, itemId: string, notes: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => 
            item.id === itemId ? { ...item, notes } : item
          ),
        };
      }
      return cat;
    }));
  };

  const getCategoryProgress = (category: InspectionCategory) => {
    const completed = category.items.filter(item => item.status !== null).length;
    return (completed / category.items.length) * 100;
  };

  const getTotalProgress = () => {
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const completedItems = categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.status !== null).length, 0
    );
    return (completedItems / totalItems) * 100;
  };

  const getFailedItems = () => {
    return categories.flatMap(cat => 
      cat.items.filter(item => item.status === "fail").map(item => ({
        ...item,
        category: cat.title,
      }))
    );
  };

  const canSubmit = () => {
    return getTotalProgress() === 100 && 
           vehicleInfo.truckNumber && 
           vehicleInfo.odometer;
  };

  const handleSubmit = async () => {
    const failedItems = getFailedItems();
    if (failedItems.length > 0) {
      toast.error(`Cannot proceed: ${failedItems.length} item(s) failed inspection`);
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Pre-trip inspection completed successfully!");
    navigate("/driver");
  };

  const nextCategory = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
    } else {
      setShowSummary(true);
    }
  };

  const prevCategory = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  if (showSummary) {
    const failedItems = getFailedItems();
    const passedCount = categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.status === "pass").length, 0
    );
    const naCount = categories.reduce(
      (sum, cat) => sum + cat.items.filter(item => item.status === "na").length, 0
    );

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Inspection Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-700/30">
              <div>
                <p className="text-sm text-slate-400">Truck #</p>
                <p className="text-white font-medium">{vehicleInfo.truckNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Trailer #</p>
                <p className="text-white font-medium">{vehicleInfo.trailerNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Odometer</p>
                <p className="text-white font-medium">{vehicleInfo.odometer} mi</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Location</p>
                <p className="text-white font-medium">{vehicleInfo.location || "N/A"}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">{passedCount}</p>
                <p className="text-xs text-slate-400">Passed</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 text-center">
                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-400">{failedItems.length}</p>
                <p className="text-xs text-slate-400">Failed</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-500/10 text-center">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-400">{naCount}</p>
                <p className="text-xs text-slate-400">N/A</p>
              </div>
            </div>

            {/* Failed Items */}
            {failedItems.length > 0 && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 mb-3">
                  <TriangleAlert className="w-5 h-5" />
                  <span className="font-medium">Failed Items - Cannot Proceed</span>
                </div>
                <div className="space-y-2">
                  {failedItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded bg-red-500/10">
                      <div>
                        <p className="text-white text-sm">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.category}</p>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-red-300">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={prevCategory} className="border-slate-600">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || failedItems.length > 0}
                className={cn(
                  "flex-1",
                  failedItems.length > 0 ? "bg-red-600" : "bg-green-600 hover:bg-green-700"
                )}
              >
                {isSubmitting ? "Submitting..." : failedItems.length > 0 ? "Cannot Submit - Fix Issues" : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Complete Inspection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pre-Trip Inspection</h1>
        <p className="text-slate-400 text-sm">DOT/FMCSA Compliant Checklist</p>
      </div>

      {/* Vehicle Info (first category only) */}
      {currentCategoryIndex === 0 && (
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Truck Number *</Label>
                <Input
                  value={vehicleInfo.truckNumber}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, truckNumber: e.target.value })}
                  placeholder="TRK-001"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Trailer Number</Label>
                <Input
                  value={vehicleInfo.trailerNumber}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, trailerNumber: e.target.value })}
                  placeholder="TRL-001"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Odometer *</Label>
                <Input
                  type="number"
                  value={vehicleInfo.odometer}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, odometer: e.target.value })}
                  placeholder="125000"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Location</Label>
                <Input
                  value={vehicleInfo.location}
                  onChange={(e) => setVehicleInfo({ ...vehicleInfo, location: e.target.value })}
                  placeholder="Terminal or city"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-white">{Math.round(getTotalProgress())}%</span>
        </div>
        <Progress value={getTotalProgress()} className="h-2" />
      </div>

      {/* Category Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat, index) => {
          const Icon = cat.icon;
          const progress = getCategoryProgress(cat);
          const hasFailures = cat.items.some(item => item.status === "fail");
          
          return (
            <button
              key={cat.id}
              onClick={() => setCurrentCategoryIndex(index)}
              className={cn(
                "flex-shrink-0 p-3 rounded-lg border transition-colors",
                index === currentCategoryIndex 
                  ? "border-blue-500 bg-blue-500/20" 
                  : hasFailures 
                    ? "border-red-500/50 bg-red-500/10"
                    : progress === 100 
                      ? "border-green-500/50 bg-green-500/10" 
                      : "border-slate-600 hover:border-slate-500"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                index === currentCategoryIndex ? "text-blue-400" :
                hasFailures ? "text-red-400" :
                progress === 100 ? "text-green-400" : "text-slate-400"
              )} />
            </button>
          );
        })}
      </div>

      {/* Current Category */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              {React.createElement(currentCategory.icon, { className: "w-5 h-5 text-blue-400" })}
              {currentCategory.title}
            </CardTitle>
            <Badge className={cn(
              getCategoryProgress(currentCategory) === 100 
                ? "bg-green-500/20 text-green-400" 
                : "bg-slate-500/20 text-slate-400"
            )}>
              {Math.round(getCategoryProgress(currentCategory))}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentCategory.items.map((item) => (
              <div 
                key={item.id} 
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  item.status === "pass" ? "border-green-500/30 bg-green-500/10" :
                  item.status === "fail" ? "border-red-500/30 bg-red-500/10" :
                  item.status === "na" ? "border-slate-500/30 bg-slate-500/10" :
                  "border-slate-600"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm">{item.label}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateItemStatus(currentCategory.id, item.id, "pass")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        item.status === "pass" 
                          ? "bg-green-500 text-white" 
                          : "bg-slate-700 text-slate-400 hover:text-green-400"
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateItemStatus(currentCategory.id, item.id, "fail")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        item.status === "fail" 
                          ? "bg-red-500 text-white" 
                          : "bg-slate-700 text-slate-400 hover:text-red-400"
                      )}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateItemStatus(currentCategory.id, item.id, "na")}
                      className={cn(
                        "p-2 rounded transition-colors",
                        item.status === "na" 
                          ? "bg-slate-500 text-white" 
                          : "bg-slate-700 text-slate-400 hover:text-slate-300"
                      )}
                    >
                      <span className="text-xs font-bold">N/A</span>
                    </button>
                  </div>
                </div>
                
                {item.status === "fail" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Describe the issue..."
                      value={item.notes || ""}
                      onChange={(e) => updateItemNotes(currentCategory.id, item.id, e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-sm"
                    />
                  </div>
                )}

                {item.photoRequired && (
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600">
                      <Camera className="w-4 h-4 mr-2" />
                      Add Photo
                    </Button>
                    <span className="text-xs text-slate-500">Photo required</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevCategory}
          disabled={currentCategoryIndex === 0}
          className="border-slate-600"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={nextCategory} className="bg-blue-600 hover:bg-blue-700">
          {currentCategoryIndex === categories.length - 1 ? "Review" : "Next"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
