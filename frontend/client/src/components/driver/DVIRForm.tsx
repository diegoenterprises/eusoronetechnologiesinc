/**
 * DVIR (DRIVER VEHICLE INSPECTION REPORT) COMPONENT
 * Pre-trip and Post-trip inspection form for drivers
 * Based on 04_DRIVER_USER_JOURNEY.md and 49 CFR 396.11
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, CheckCircle, XCircle, AlertTriangle, Camera,
  Clock, FileText, ChevronRight, ChevronDown, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
}

interface InspectionResult {
  itemId: string;
  status: "ok" | "defect" | "not_applicable";
  notes?: string;
}

interface DVIRFormProps {
  inspectionType: "pre_trip" | "post_trip";
  vehicleNumber: string;
  trailerNumber?: string;
  driverName: string;
  onSubmit: (results: InspectionResult[], defectsFound: boolean, certifyNoDefects: boolean) => void;
  onCancel: () => void;
}

const TRACTOR_ITEMS: InspectionItem[] = [
  { id: "t1", category: "Engine Compartment", item: "Oil Level", required: true },
  { id: "t2", category: "Engine Compartment", item: "Coolant Level", required: true },
  { id: "t3", category: "Engine Compartment", item: "Power Steering Fluid", required: true },
  { id: "t4", category: "Engine Compartment", item: "Belts & Hoses", required: true },
  { id: "t5", category: "Engine Compartment", item: "Leaks (oil, coolant, fuel)", required: true },
  { id: "t6", category: "Cab", item: "Horn", required: true },
  { id: "t7", category: "Cab", item: "Windshield Wipers/Washers", required: true },
  { id: "t8", category: "Cab", item: "Mirrors (all)", required: true },
  { id: "t9", category: "Cab", item: "Gauges/Warning Lights", required: true },
  { id: "t10", category: "Cab", item: "Seat Belt", required: true },
  { id: "t11", category: "Cab", item: "Fire Extinguisher", required: true },
  { id: "t12", category: "Cab", item: "Emergency Triangles", required: true },
  { id: "t13", category: "Lights", item: "Headlights (high/low)", required: true },
  { id: "t14", category: "Lights", item: "Turn Signals (front/rear)", required: true },
  { id: "t15", category: "Lights", item: "Brake Lights", required: true },
  { id: "t16", category: "Lights", item: "Marker/Clearance Lights", required: true },
  { id: "t17", category: "Lights", item: "4-Way Flashers", required: true },
  { id: "t18", category: "Brakes", item: "Service Brake Operation", required: true },
  { id: "t19", category: "Brakes", item: "Parking Brake", required: true },
  { id: "t20", category: "Brakes", item: "Air Pressure Build-up", required: true },
  { id: "t21", category: "Brakes", item: "Air Brake Leakage Test", required: true },
  { id: "t22", category: "Brakes", item: "Low Air Pressure Warning", required: true },
  { id: "t23", category: "Tires/Wheels", item: "Tires (condition/pressure)", required: true },
  { id: "t24", category: "Tires/Wheels", item: "Wheel Lugs (tight)", required: true },
  { id: "t25", category: "Tires/Wheels", item: "Wheel Seals (no leaks)", required: true },
  { id: "t26", category: "Coupling", item: "Fifth Wheel", required: true },
  { id: "t27", category: "Coupling", item: "Kingpin/Apron", required: true },
  { id: "t28", category: "Coupling", item: "Air/Electric Lines", required: true },
];

const TRAILER_ITEMS: InspectionItem[] = [
  { id: "tr1", category: "Lights", item: "Marker/Clearance Lights", required: true },
  { id: "tr2", category: "Lights", item: "Turn Signals", required: true },
  { id: "tr3", category: "Lights", item: "Brake Lights", required: true },
  { id: "tr4", category: "Lights", item: "Reflectors", required: true },
  { id: "tr5", category: "Brakes", item: "Brake Operation", required: true },
  { id: "tr6", category: "Brakes", item: "Brake Adjustment", required: true },
  { id: "tr7", category: "Tires/Wheels", item: "Tires (condition/pressure)", required: true },
  { id: "tr8", category: "Tires/Wheels", item: "Wheel Lugs", required: true },
  { id: "tr9", category: "Body/Frame", item: "Frame/Body Condition", required: true },
  { id: "tr10", category: "Body/Frame", item: "Landing Gear", required: true },
  { id: "tr11", category: "Tanker Specific", item: "Tank Integrity", required: true },
  { id: "tr12", category: "Tanker Specific", item: "Valves & Caps", required: true },
  { id: "tr13", category: "Tanker Specific", item: "Emergency Vents", required: true },
  { id: "tr14", category: "Tanker Specific", item: "Placards", required: true },
  { id: "tr15", category: "Tanker Specific", item: "Grounding Cable", required: true },
];

export function DVIRForm({ 
  inspectionType, 
  vehicleNumber, 
  trailerNumber, 
  driverName, 
  onSubmit, 
  onCancel 
}: DVIRFormProps) {
  const [results, setResults] = useState<Map<string, InspectionResult>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Engine Compartment"]));
  const [defectNotes, setDefectNotes] = useState("");
  const [certifyNoDefects, setCertifyNoDefects] = useState(false);

  const allItems = [...TRACTOR_ITEMS, ...(trailerNumber ? TRAILER_ITEMS : [])];
  const categories = Array.from(new Set(allItems.map(item => item.category)));

  const getItemStatus = (itemId: string): InspectionResult["status"] | null => {
    return results.get(itemId)?.status || null;
  };

  const setItemStatus = (itemId: string, status: InspectionResult["status"]) => {
    const newResults = new Map(results);
    newResults.set(itemId, { itemId, status });
    setResults(newResults);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryProgress = (category: string) => {
    const categoryItems = allItems.filter(item => item.category === category);
    const completed = categoryItems.filter(item => results.has(item.id)).length;
    return { completed, total: categoryItems.length };
  };

  const getCategoryStatus = (category: string): "complete" | "incomplete" | "defect" => {
    const categoryItems = allItems.filter(item => item.category === category);
    const hasDefect = categoryItems.some(item => results.get(item.id)?.status === "defect");
    if (hasDefect) return "defect";
    const allComplete = categoryItems.every(item => results.has(item.id));
    return allComplete ? "complete" : "incomplete";
  };

  const totalProgress = {
    completed: results.size,
    total: allItems.length,
    defects: Array.from(results.values()).filter(r => r.status === "defect").length,
  };

  const canSubmit = results.size === allItems.length;
  const hasDefects = totalProgress.defects > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Please complete all inspection items");
      return;
    }
    
    if (hasDefects && !defectNotes.trim()) {
      toast.error("Please describe the defects found");
      return;
    }

    onSubmit(Array.from(results.values()), hasDefects, certifyNoDefects);
    toast.success("DVIR submitted successfully", {
      description: hasDefects 
        ? "Defects have been reported to maintenance." 
        : "Vehicle cleared for operation.",
    });
  };

  const markAllOk = (category: string) => {
    const categoryItems = allItems.filter(item => item.category === category);
    const newResults = new Map(results);
    categoryItems.forEach(item => {
      newResults.set(item.id, { itemId: item.id, status: "ok" });
    });
    setResults(newResults);
  };

  return (
    <Card className="bg-white/[0.02] border-slate-700">
      <CardHeader className="border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              {inspectionType === "pre_trip" ? "Pre-Trip" : "Post-Trip"} Inspection
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              Vehicle: {vehicleNumber} {trailerNumber && `• Trailer: ${trailerNumber}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Driver</p>
            <p className="text-white font-medium">{driverName}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">
              {totalProgress.completed} of {totalProgress.total} items inspected
            </span>
            {totalProgress.defects > 0 && (
              <Badge className="bg-red-500/20 text-red-400">
                {totalProgress.defects} defect{totalProgress.defects > 1 ? "s" : ""} found
              </Badge>
            )}
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                hasDefects ? "bg-yellow-500" : "bg-green-500"
              )}
              style={{ width: `${(totalProgress.completed / totalProgress.total) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 max-h-[500px] overflow-y-auto">
        {categories.map((category) => {
          const { completed, total } = getCategoryProgress(category);
          const status = getCategoryStatus(category);
          const isExpanded = expandedCategories.has(category);
          const categoryItems = allItems.filter(item => item.category === category);

          return (
            <div key={category} className="border-b border-white/[0.06] last:border-0">
              {/* Category Header */}
              <div 
                onClick={() => toggleCategory(category)}
                className={cn(
                  "flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.06]/30 transition-colors",
                  status === "defect" && "bg-red-500/5"
                )}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-medium text-white">{category}</span>
                  <span className="text-xs text-slate-500">({completed}/{total})</span>
                </div>
                <div className="flex items-center gap-2">
                  {status === "complete" && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  {status === "defect" && (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  {isExpanded && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); markAllOk(category); }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Mark All OK
                    </Button>
                  )}
                </div>
              </div>

              {/* Category Items */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {categoryItems.map((item) => {
                    const itemStatus = getItemStatus(item.id);
                    
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          itemStatus === "ok" && "bg-green-500/10",
                          itemStatus === "defect" && "bg-red-500/10",
                          !itemStatus && "bg-slate-700/30"
                        )}
                      >
                        <span className={cn(
                          "text-sm",
                          itemStatus ? "text-white" : "text-slate-400"
                        )}>
                          {item.item}
                          {item.required && <span className="text-red-400 ml-1">*</span>}
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={itemStatus === "ok" ? "default" : "outline"}
                            onClick={() => setItemStatus(item.id, "ok")}
                            className={cn(
                              "h-8 px-3",
                              itemStatus === "ok" 
                                ? "bg-green-600 hover:bg-green-700" 
                                : "border-slate-600 hover:bg-green-600/20"
                            )}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={itemStatus === "defect" ? "default" : "outline"}
                            onClick={() => setItemStatus(item.id, "defect")}
                            className={cn(
                              "h-8 px-3",
                              itemStatus === "defect" 
                                ? "bg-red-600 hover:bg-red-700" 
                                : "border-slate-600 hover:bg-red-600/20"
                            )}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={itemStatus === "not_applicable" ? "default" : "outline"}
                            onClick={() => setItemStatus(item.id, "not_applicable")}
                            className={cn(
                              "h-8 px-3 text-xs",
                              itemStatus === "not_applicable" 
                                ? "bg-slate-600 hover:bg-white/[0.06]" 
                                : "border-slate-600"
                            )}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>

      {/* Defect Notes */}
      {hasDefects && (
        <div className="p-4 border-t border-slate-700 bg-red-500/5">
          <label className="block text-sm font-medium text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Describe Defects Found *
          </label>
          <Textarea
            value={defectNotes}
            onChange={(e) => setDefectNotes(e.target.value)}
            placeholder="Describe each defect in detail..."
            className="bg-white/[0.04] border-slate-600 text-white min-h-[80px]"
          />
          <Button variant="outline" size="sm" className="mt-2 border-slate-600">
            <Camera className="w-4 h-4 mr-2" />
            Add Photos
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {!hasDefects && canSubmit && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={certifyNoDefects}
              onChange={(e) => setCertifyNoDefects(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700"
            />
            <span className="text-sm text-slate-300">
              I certify that this vehicle has been inspected and no defects were found that would affect safe operation.
            </span>
          </label>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleString()}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="border-slate-600">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || (!hasDefects && !certifyNoDefects)}
              className={hasDefects ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
            >
              <Shield className="w-4 h-4 mr-2" />
              {hasDefects ? "Submit with Defects" : "Submit DVIR"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DVIRForm;
